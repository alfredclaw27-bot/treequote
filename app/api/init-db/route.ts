import { NextResponse } from "next/server";

const SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  photo_url TEXT NOT NULL DEFAULT '',
  analysis_data JSONB,
  estimated_price JSONB,
  service_types TEXT[] NOT NULL DEFAULT '{}',
  address TEXT NOT NULL DEFAULT '',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  google_maps_verified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'quoted', 'closed')),
  stripe_payment_id TEXT,
  notifications_sent INTEGER DEFAULT 0,
  notification_targets TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL DEFAULT '',
  business_name TEXT NOT NULL,
  phone TEXT,
  service_area TEXT[] DEFAULT '{}',
  specialties TEXT[] DEFAULT '{}',
  approved BOOLEAN DEFAULT false,
  stripe_customer_id TEXT,
  equipment JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  contractor_id UUID REFERENCES contractors(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  estimated_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lead_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  contractor_id UUID REFERENCES contractors(id) ON DELETE SET NULL,
  paid BOOLEAN DEFAULT false,
  stripe_payment_id TEXT,
  accessed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lead_id, contractor_id)
);
`.trim();

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  // Try Supabase's REST SQL endpoint (PgBouncer-aware)
  const restUrl = `${supabaseUrl}/rest/v1/rpc/exec`;

  try {
    const res = await fetch(restUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
        "X-enant": "postgresql",
      },
      body: JSON.stringify({ query: SCHEMA_SQL }),
    });

    const data = await res.json();
    if (res.ok) {
      return NextResponse.json({ success: true, method: "rest_rpc", data });
    }

    // Try management API endpoint
    const ref = supabaseUrl.replace("https://", "").replace(".supabase.co", "");
    const mgmtUrl = `https://api.supabase.com/v1/projects/${ref}/database/query`;

    const mgmtRes = await fetch(mgmtUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.SUPABASE_ACCESS_TOKEN ?? serviceKey}`,
        "apikey": process.env.SUPABASE_ACCESS_TOKEN ?? serviceKey,
      },
      body: JSON.stringify({ statements: [{ sql: SCHEMA_SQL }] }),
    });

    const mgmtData = await mgmtRes.json();
    return NextResponse.json({
      rest_tried: true,
      rest_error: data,
      mgmt_status: mgmtRes.status,
      mgmt_data: mgmtData,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
