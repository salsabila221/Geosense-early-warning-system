import { Card, CardContent } from "@/components/ui/card"

const stats = [
  {
    title: "Node Aktif",
    value: "12",
  },
  {
    title: "WhatsApp",
    value: "Connected",
  },
  {
    title: "Rata-rata Getaran",
    value: "2.81 Hz",
  },
]

export default function QuickStats() {
  return (
    <section className="mt-6 grid gap-5 md:grid-cols-3">

      {stats.map((item) => (
        <Card
          key={item.title}
          className="border border-border/70 shadow-sm"
        >
          <CardContent className="p-6">

            <p className="text-sm text-muted-foreground">
              {item.title}
            </p>

            <h3 className="mt-2 text-3xl font-bold text-foreground">
              {item.value}
            </h3>

          </CardContent>
        </Card>
      ))}

    </section>
  )
}