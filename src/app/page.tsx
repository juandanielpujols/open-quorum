import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  if (!session) redirect("/login");
  switch (session.user.rol) {
    case "ADMIN":
      redirect("/eventos");
    case "REVIEWER":
      redirect("/reviewer/eventos");
    case "VOTANTE":
      redirect("/votante/eventos");
  }
}
