import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/src/lib/api/config";
import { API_ROUTES } from "@/src/lib/api/routes";

type LoginBody = {
  email: string;
  password: string;
};

export async function POST(req: Request) {
  if (!API_BASE_URL) {
    return NextResponse.json(
      { success: false, message: "Missing API_URL in server env" },
      { status: 500 }
    );
  }

  const body = (await req.json()) as LoginBody;

  const upstream = await fetch(`${API_BASE_URL}${API_ROUTES.auth.login}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const contentType = upstream.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await upstream.json() : await upstream.text();

  return NextResponse.json(data, { status: upstream.status });
}

