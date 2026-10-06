#!/usr/bin/env python3
"""Generates types/database.ts (Supabase `Database` shape) from a live Postgres.
Usage: python3 scripts/gen-db-types.py "<psql connection args>"  > types/database.ts
On a real Supabase project prefer: npx supabase gen types typescript --project-id <id>
This generator exists so the types can be produced and checked without Docker."""
import json, subprocess, sys

conn = sys.argv[1:]  # e.g. -d noire_test
def q(sql):
    out = subprocess.run(["psql", *conn, "-t", "-A", "-c", sql], capture_output=True, text=True, check=True).stdout
    return json.loads(out.strip() or "[]")

cols = q("""select coalesce(json_agg(c order by table_name, ordinal_position),'[]') from (
  select c.table_name, c.column_name, c.data_type, c.udt_name, c.is_nullable, c.column_default, c.ordinal_position
  from information_schema.columns c
  join information_schema.tables t on t.table_schema=c.table_schema and t.table_name=c.table_name and t.table_type='BASE TABLE'
  where c.table_schema='public') c""")
fks = q("""select coalesce(json_agg(f),'[]') from (
  select con.conname as name, cl.relname as tbl,
    (select json_agg(a.attname order by k.ord) from unnest(con.conkey) with ordinality k(attnum,ord) join pg_attribute a on a.attrelid=con.conrelid and a.attnum=k.attnum) as cols,
    rcl.relname as ref_tbl,
    (select json_agg(a.attname order by k.ord) from unnest(con.confkey) with ordinality k(attnum,ord) join pg_attribute a on a.attrelid=con.confrelid and a.attnum=k.attnum) as ref_cols,
    exists (select 1 from pg_constraint u where u.conrelid=con.conrelid and u.contype in ('p','u') and u.conkey::int2[] = con.conkey::int2[]) as one_to_one
  from pg_constraint con
  join pg_class cl on cl.oid=con.conrelid join pg_namespace n on n.oid=cl.relnamespace
  join pg_class rcl on rcl.oid=con.confrelid join pg_namespace rn on rn.oid=rcl.relnamespace
  where con.contype='f' and n.nspname='public' and rn.nspname='public') f""")

def ts_type(c):
    t, u = c["data_type"], c["udt_name"]
    if t == "ARRAY":
        base = {"_text": "string", "_varchar": "string", "_uuid": "string", "_int4": "number", "_int2": "number"}.get(u, "string")
        return base + "[]"
    if u in ("bool",): return "boolean"
    if u in ("int2", "int4", "int8", "numeric", "float4", "float8"): return "number"
    if u in ("json", "jsonb"): return "Json"
    return "string"   # uuid, text, varchar, date, time, timestamptz, tsrange...

tables = {}
for c in cols: tables.setdefault(c["table_name"], []).append(c)

out = []
out.append("// AUTO-GENERATED from the NOIRÉ Phase 1 migrations. Do not edit by hand.")
out.append("// Regenerate on Supabase with: npx supabase gen types typescript --project-id <id> > types/database.ts")
out.append("")
out.append("export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];")
out.append("")
out.append("export type Database = {")
out.append("  public: {")
out.append("    Tables: {")
for name in sorted(tables):
    cs = tables[name]
    out.append(f"      {name}: {{")
    out.append("        Row: {")
    for c in cs:
        n = " | null" if c["is_nullable"] == "YES" else ""
        out.append(f"          {c['column_name']}: {ts_type(c)}{n};")
    out.append("        };")
    for kind in ("Insert", "Update"):
        out.append(f"        {kind}: {{")
        for c in cs:
            n = " | null" if c["is_nullable"] == "YES" else ""
            optional = kind == "Update" or c["is_nullable"] == "YES" or c["column_default"] is not None \
                or (name == "reservations" and c["column_name"] == "duration_minutes")
            out.append(f"          {c['column_name']}{'?' if optional else ''}: {ts_type(c)}{n};")
        out.append("        };")
    out.append("        Relationships: [")
    for f in [f for f in fks if f["tbl"] == name]:
        cols_s = ", ".join(f'"{x}"' for x in f["cols"]); rc = ", ".join(f'"{x}"' for x in f["ref_cols"])
        out.append("          {")
        out.append(f'            foreignKeyName: "{f["name"]}";')
        out.append(f"            columns: [{cols_s}];")
        out.append(f"            isOneToOne: {'true' if f['one_to_one'] else 'false'};")
        out.append(f'            referencedRelation: "{f["ref_tbl"]}";')
        out.append(f"            referencedColumns: [{rc}];")
        out.append("          },")
    out.append("        ];")
    out.append("      };")
out.append("    };")
out.append("    Views: { [_ in never]: never };")
out.append("    Functions: {")
out.append("      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };")
out.append("      is_staff: { Args: Record<PropertyKey, never>; Returns: boolean };")
out.append("      reserved_table_ids: {")
out.append("        Args: { p_restaurant_id: string; p_date: string; p_time: string; p_duration_minutes?: number };")
out.append("        Returns: string[];")
out.append("      };")
out.append("      set_user_role: { Args: { p_user_id: string; p_role: string }; Returns: undefined };")
out.append("    };")
out.append("    Enums: { [_ in never]: never };")
out.append("    CompositeTypes: { [_ in never]: never };")
out.append("  };")
out.append("};")
out.append("")
out.append("type PublicSchema = Database['public'];")
out.append("export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];")
out.append("export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert'];")
out.append("export type TablesUpdate<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update'];")
print("\n".join(out))
