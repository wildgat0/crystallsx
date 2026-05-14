import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Inicializando base de datos...");

  // Admin user (creado como Customer)
  const hashedPassword = await bcrypt.hash("admin123", 12);
  await prisma.customer.upsert({
    where: { email: "admin@crystallsx.com" },
    update: {},
    create: {
      email: "admin@crystallsx.com",
      password: hashedPassword,
      name: "Administrador",
    },
  });
  console.log("✅ Usuario admin creado: admin@crystallsx.com / admin123");

  // App config
  const configs = [
    { key: "rotation_threshold", value: "50" },
    { key: "orders_since_rotation", value: "0" },
    { key: "store_name", value: "Crystallsx" },
    { key: "store_email", value: "contacto@crystallsx.com" },
    { key: "tax_rate", value: "0.19" },
  ];
  for (const config of configs) {
    await prisma.appConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }
  console.log("✅ Configuración de la app inicializada");

  // Productos — solo sembrar si la tabla está vacía para no sobreescribir datos reales
  const productCount = await prisma.product.count();
  if (productCount === 0) {
    const products = [
      {
        id: "chaqueta-oversize-deconstructed",
        name: "Chaqueta Oversize Deconstructed",
        description: "Chaqueta oversize en lana virgen con costuras expuestas y etiquetas invertidas. Artesanía radical al descubierto.",
        price: 485000,
      },
      {
        id: "sneakers-chunky-platform",
        name: "Sneakers Chunky Platform",
        description: "Zapatillas de plataforma triple suela en cuero premium. Silueta exagerada, presencia absoluta.",
        price: 320000,
      },
      {
        id: "bolso-tote-xxl-canvas",
        name: "Bolso Tote XXL Canvas",
        description: "Tote de gran formato en canvas reforzado con herrajes dorados y base de cuero curtido.",
        price: 695000,
      },
      {
        id: "abrigo-cocoon-cachemira",
        name: "Abrigo Cocoon Cachemira",
        description: "Abrigo cocoon en cachemira doble faz. Corte arquitectónico, hombros caídos y largo maxi.",
        price: 890000,
      },
      {
        id: "camiseta-distressed-graphic",
        name: "Camiseta Distressed Graphic",
        description: "Camiseta de algodón pesado 280g con gráfica degradada y costuras desbordadas al exterior.",
        price: 89000,
      },
      {
        id: "botas-tabi-split-toe",
        name: "Botas Tabi Split-Toe",
        description: "Botas de cuero italiano con punta dividida y tacón Louis. Cierre lateral y horma amplia.",
        price: 450000,
      },
      {
        id: "cinturon-hebilla-skull",
        name: "Cinturón Hebilla Skull",
        description: "Cinturón de cuero negro con hebilla en forma de calavera bañada en plata 925.",
        price: 185000,
      },
      {
        id: "pantalon-cargo-wide-leg",
        name: "Pantalón Cargo Wide Leg",
        description: "Pantalón de corte ancho con múltiples bolsillos cargo en nylon técnico. Esencia streetwear de lujo.",
        price: 265000,
      },
      {
        id: "vestido-couture-asimetrico",
        name: "Vestido Couture Asimétrico",
        description: "Vestido de alta costura en seda natural con corte asimétrico y drapeado escultórico hecho a medida.",
        price: 1850000,
      },
      {
        id: "gafas-shield-wraparound",
        name: "Gafas Shield Wraparound",
        description: "Montura envolvente en acetato negro mate con lentes espejo plateado. Forma de escudo futurista.",
        price: 145000,
      },
      {
        id: "bolso-clutch-metalico",
        name: "Bolso Clutch Metálico",
        description: "Clutch minimalista en cuero metálico plateado con cierre magnético y cadena desmontable.",
        price: 420000,
      },
      {
        id: "parka-tecnica-oversized",
        name: "Parka Técnica Oversized",
        description: "Parka oversize en nylon técnico impermeable con forro interior removible y capucha desmontable.",
        price: 675000,
      },
    ];

    for (const product of products) {
      await prisma.product.create({ data: product });
    }
    console.log(`✅ ${products.length} productos creados`);
  } else {
    console.log(`ℹ️ Productos ya existentes (${productCount}), no se sembraron de nuevo`);
  }

  // Cuenta bancaria de ejemplo
  await prisma.bankAccount.upsert({
    where: { id: "bank-001" },
    update: {},
    create: {
      id: "bank-001",
      bankName: "Banco de Chile",
      accountName: "Crystallsx SpA",
      accountNumber: "00-000-00000-00",
      rut: "76.XXX.XXX-X",
      accountType: "Corriente",
      email: "pagos@crystallsx.com",
      instructions: "Transferir el monto exacto e incluir número de pedido en el comentario.",
      active: true,
    },
  });
  console.log("✅ Cuenta bancaria de ejemplo creada");

  console.log("\n🎉 ¡Seed completo!");
  console.log("   Admin: admin@crystallsx.com / admin123");
  console.log("   URL:   http://localhost:3000");
  console.log("   Admin: http://localhost:3000/admin");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
