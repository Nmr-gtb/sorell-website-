import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;

  // Assainir le paramètre : uniquement des identifiants simples, pour empêcher
  // toute traversée de répertoire (../, chemins encodés) avant path.join.
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filePath = path.join(process.cwd(), "public", "email-previews", `${id}.html`);

  try {
    const html = await fs.promises.readFile(filePath, "utf-8");
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch {
    // Fichier absent ou illisible : 404 générique.
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
