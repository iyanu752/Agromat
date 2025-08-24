import { Leaf, SproutIcon as Seedling, ShoppingBasket, LineChart, ShieldCheck, Users } from "lucide-react"

interface FeatureCardProps {
  icon: string
  title: string
  description: string
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "leaf":
        return <Leaf className="h-10 w-10 text-green-600" />
      case "seedling":
        return <Seedling className="h-10 w-10 text-green-600" />
      case "shopping-basket":
        return <ShoppingBasket className="h-10 w-10 text-green-600" />
      case "chart-line":
        return <LineChart className="h-10 w-10 text-green-600" />
      case "shield-check":
        return <ShieldCheck className="h-10 w-10 text-green-600" />
      case "users":
        return <Users className="h-10 w-10 text-green-600" />
      default:
        return <Leaf className="h-10 w-10 text-green-600" />
    }
  }

  return (
    <div className="rounded-lg border bg-white p-6 transition-all hover:shadow-md">
      <div className="mb-4">{getIcon(icon)}</div>
      <h3 className="mb-2 text-xl font-semibold text-green-900">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
