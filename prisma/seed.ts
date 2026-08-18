import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  let company = await prisma.company.findFirst({
    where: { OR: [{ name: "Anshika Logistics" }, { name: "Fleet Fuel Demo" }] },
  });

  if (company) {
    company = await prisma.company.update({
      where: { id: company.id },
      data: {
        name: "Anshika Logistics",
        logo: "/anishka-logistics-logo.jpeg",
        address:
          "Fl.No- 07, Blgd no A/5 GR FLoor, Shree Datta Nagari Complex, Pipeline Road, Purna, Bhiwandi- 421302",
        city: "Bhiwandi",
        state: "Maharashtra",
        pincode: "421302",
        country: "India",
        phone: "8452823542",
        email: "anshikalogistics7@gmail.com",
        gst: "27GUOPD3977F1Z5",
        bankName: "YES BANK",
        bankIfsc: "YESB0000077",
        bankAccount: "007763200001514",
      },
    });
  }

  company ??= await prisma.company.create({
    data: {
      name: "Anshika Logistics",
      address:
        "Fl.No- 07, Blgd no A/5 GR FLoor, Shree Datta Nagari Complex, Pipeline Road, Purna, Bhiwandi- 421302",
      city: "Bhiwandi",
      state: "Maharashtra",
      pincode: "421302",
      country: "India",
      phone: "8452823542",
      email: "anshikalogistics7@gmail.com",
      gst: "27GUOPD3977F1Z5",
      invoicePrefix: "INV",
      invoiceStartingNumber: 1,
      upiId: "anshikalogistics@upi",
      logo: "/anishka-logistics-logo.jpeg",
      bankName: "YES BANK",
      bankIfsc: "YESB0000077",
      bankAccount: "007763200001514",
    },
  });

  const password = await hash("password123", 12);

  await prisma.user.upsert({
    where: { email: "admin@fleetfuel.com" },
    update: {
      name: "Fleet Admin",
      role: "ADMIN",
      isActive: true,
      companyId: company.id,
      password,
    },
    create: {
      name: "Fleet Admin",
      email: "admin@fleetfuel.com",
      role: "ADMIN",
      isActive: true,
      companyId: company.id,
      password,
    },
  });

  const drivers = [
    {
      name: "Ravi Kumar",
      phone: "9876543210",
      licenseNumber: "DL-0420220012345",
      salary: 25000,
    },
    {
      name: "Amit Singh",
      phone: "9876501234",
      licenseNumber: "DL-0420210098765",
      salary: 26000,
    },
  ];

  for (const data of drivers) {
    const exists = await prisma.driver.findFirst({
      where: { companyId: company.id, phone: data.phone },
    });
    if (!exists) {
      await prisma.driver.create({
        data: {
          ...data,
          companyId: company.id,
          joiningDate: new Date(),
          isActive: true,
        },
      });
    }
  }

  const vehicles = [
    {
      number: "DL-01-AB-1234",
      type: "Truck",
      make: "Tata",
      model: "Prima",
      year: 2022,
      fuelType: "DIESEL" as const,
      mileage: 5.5,
      capacity: 25,
      owner: "Anshika Logistics",
    },
    {
      number: "HR-55-CD-5678",
      type: "Tanker",
      make: "Ashok Leyland",
      model: "AVTR",
      year: 2023,
      fuelType: "DIESEL" as const,
      mileage: 4.8,
      capacity: 30,
      owner: "Anshika Logistics",
    },
  ];

  for (const data of vehicles) {
    await prisma.vehicle.upsert({
      where: {
        companyId_number: { companyId: company.id, number: data.number },
      },
      update: {},
      create: { ...data, companyId: company.id, status: "ACTIVE" },
    });
  }

  console.log("Seeded successfully.");
  console.log("Login: admin@fleetfuel.com / password123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
