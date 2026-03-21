import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

type CheckResult = {
  label: string;
  ok: boolean;
  details: string;
};

function asBadge(ok: boolean) {
  return ok ? "secondary" : "destructive";
}

export default async function StatusPage() {
  const checks: CheckResult[] = [];

  const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const hasOCRSpaceKey = Boolean(process.env.OCR_SPACE_API_KEY);
  const hasGoogleVisionKey = Boolean(process.env.GOOGLE_CLOUD_VISION_API_KEY);
  const hasGoogleVisionServiceAccount =
    Boolean(process.env.GOOGLE_CLOUD_VISION_SERVICE_ACCOUNT_JSON) ||
    Boolean(process.env.GOOGLE_CLOUD_VISION_SERVICE_ACCOUNT_FILE);
  const hasGoogleVisionPdfBucket = Boolean(process.env.GOOGLE_CLOUD_VISION_PDF_BUCKET);

  checks.push({
    label: "NEXT_PUBLIC_SUPABASE_URL",
    ok: hasSupabaseUrl,
    details: hasSupabaseUrl ? "Configuree" : "Manquante",
  });
  checks.push({
    label: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ok: hasAnonKey,
    details: hasAnonKey ? "Configuree" : "Manquante",
  });
  checks.push({
    label: "SUPABASE_SERVICE_ROLE_KEY",
    ok: hasServiceRoleKey,
    details: hasServiceRoleKey ? "Configuree" : "Manquante (recommandee)",
  });
  checks.push({
    label: "OCR_SPACE_API_KEY",
    ok: hasOCRSpaceKey,
    details: hasOCRSpaceKey
      ? "Configuree (OCR.space utilisable)"
      : "Manquante (optionnel)",
  });
  checks.push({
    label: "GOOGLE_CLOUD_VISION_API_KEY",
    ok: hasGoogleVisionKey,
    details: hasGoogleVisionKey
      ? "Configuree (Google Vision utilisable)"
      : "Manquante (optionnel)",
  });
  checks.push({
    label: "GOOGLE_VISION_PDF_ASYNC_AUTH",
    ok: hasGoogleVisionServiceAccount,
    details: hasGoogleVisionServiceAccount
      ? "Configuree (Service Account detecte)"
      : "Manquante (optionnel, requis pour PDF async Google Vision)",
  });
  checks.push({
    label: "GOOGLE_CLOUD_VISION_PDF_BUCKET",
    ok: hasGoogleVisionPdfBucket,
    details: hasGoogleVisionPdfBucket
      ? "Configuree (bucket PDF async)"
      : "Manquante (optionnel, requis pour PDF async Google Vision)",
  });

  let dbConnectivity: CheckResult = {
    label: "Connexion Supabase DB",
    ok: false,
    details: "Non testee",
  };

  if (hasSupabaseUrl && hasAnonKey) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.from("songs").select("id").limit(1);
      if (error) {
        dbConnectivity = {
          label: "Connexion Supabase DB",
          ok: false,
          details: `Erreur: ${error.message}`,
        };
      } else {
        dbConnectivity = {
          label: "Connexion Supabase DB",
          ok: true,
          details: "OK (table songs accessible)",
        };
      }
    } catch (error) {
      dbConnectivity = {
        label: "Connexion Supabase DB",
        ok: false,
        details: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  } else {
    dbConnectivity = {
      label: "Connexion Supabase DB",
      ok: false,
      details: "Variables Supabase manquantes",
    };
  }

  checks.push(dbConnectivity);

  const allCriticalOk =
    hasSupabaseUrl &&
    hasAnonKey &&
    Boolean(checks.find((c) => c.label === "Connexion Supabase DB")?.ok);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Status</h1>
        <p className="text-muted-foreground">
          Verification rapide de la configuration locale (sans exposer de secrets).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Etat global</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={asBadge(Boolean(allCriticalOk))}>
            {allCriticalOk ? "Pret pour tester l'app" : "Configuration incomplete"}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Checks configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {checks.map((check) => (
            <div
              key={check.label}
              className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{check.label}</p>
                <p className="text-sm text-muted-foreground">{check.details}</p>
              </div>
              <Badge variant={asBadge(check.ok)}>{check.ok ? "OK" : "KO"}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
