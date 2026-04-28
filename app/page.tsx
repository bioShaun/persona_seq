import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="container flex min-h-screen items-center justify-center py-10">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <Badge className="w-fit">MVP</Badge>
          <CardTitle className="mt-3 text-3xl">Proposal Platform</CardTitle>
          <CardDescription>Next.js App Router scaffold with Tailwind CSS and shadcn/ui.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button>Get started</Button>
        </CardContent>
      </Card>
    </main>
  );
}
