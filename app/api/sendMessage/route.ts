import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase-server";
import { TemplateRequest } from "@/types/message-template-request";
import { sendWhatsAppMessage } from "./functions";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log("user", user);
  if (!user) {
    return new NextResponse(null, { status: 401 });
  }
  const reqFormData = await request.formData();
  console.log("reqFormData", reqFormData);
  const message = reqFormData.get("message")?.toString();
  const fileType = reqFormData.get("fileType")?.toString();
  const file: File | null = reqFormData.get("file") as File | null;

  const reqFormDataTemplate = reqFormData.get("template")?.toString();
  const template: TemplateRequest | null | undefined =
    reqFormDataTemplate && JSON.parse(reqFormDataTemplate);
  const to = reqFormData.get("to")?.toString();
  if (!to) {
    return new NextResponse(null, { status: 400 });
  }
  if (!message && !file && !template) {
    return new NextResponse(null, { status: 400 });
  }
  await sendWhatsAppMessage(to, message, fileType, file, template);
  return new NextResponse();
}
