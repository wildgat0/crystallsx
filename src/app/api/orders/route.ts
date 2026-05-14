import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveBankAccount } from "@/lib/bank-rotation";
import { generateOrderNumber } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer, address, items, paymentType, receiptUrl } = body as {
      customer: {
        name: string;
        email: string;
        phone?: string;
      };
      address: {
        address: string;
        city: string;
        state?: string;
        zip: string;
        country: string;
      };
      items: Array<{ id: string; qty: number }>;
      paymentType?: string;
      receiptUrl?: string;
    };

    if (!customer?.name || !customer?.email || !address?.address || !items?.length) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Validate products exist
    const productIds = items.map((i) => i.id);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "Uno o más productos no están disponibles" }, { status: 400 });
    }

    // Get config
    const taxCfg = await prisma.appConfig.findUnique({ where: { key: "tax_rate" } });
    const taxRate = parseFloat(taxCfg?.value ?? "0.19");

    // Calculate totals
    const subtotal = items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.id)!;
      return sum + product.price * item.qty;
    }, 0);

    const tax = Math.round(subtotal * taxRate * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    // Get active bank account
    const bankAccount = await getActiveBankAccount();

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        address: address.address,
        city: address.city,
        state: address.state,
        zip: address.zip,
        country: address.country,
        subtotal,
        shipping: 0,
        tax,
        total,
        bankAccountId: bankAccount?.id,
        paymentType: paymentType ?? null,
        receiptUrl: receiptUrl ?? null,
        items: {
          create: items.map((item) => {
            const product = products.find((p) => p.id === item.id)!;
            return {
              productId: product.id,
              productName: product.name,
              price: product.price,
              qty: item.qty,
            };
          }),
        },
      },
      include: { bankAccount: true, items: true },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
