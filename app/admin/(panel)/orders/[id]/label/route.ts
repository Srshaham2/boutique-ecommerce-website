import { getAdminUser } from "@/lib/admin/auth"
import { getOrder } from "@/lib/admin/queries"
import { buildShippingLabelPdf } from "@/lib/shipping-label"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Route handlers aren't wrapped by the panel layout — guard here too.
  const admin = await getAdminUser()
  if (!admin) return new Response("Not found", { status: 404 })

  const { id } = await params
  const order = await getOrder(id)
  if (!order) return new Response("Not found", { status: 404 })

  const date = new Date(order.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const pdf = await buildShippingLabelPdf({
    orderNumber: order.order_number,
    customerName: order.customer_name,
    addressLine: order.address_line,
    city: order.city,
    state: order.state,
    zip: order.zip,
    phone: order.customer_phone,
    date,
  })

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="BieLux-${order.order_number}-label.pdf"`,
    },
  })
}
