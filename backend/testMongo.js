const mongoose = require("mongoose");
require("dotenv").config();
const Internship = require("./Model/Internship");

async function seed() {
  try {
    console.log("Connecting to:", process.env.DATABASE_URL);
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("Connected successfully!");
    
    const count = await Internship.countDocuments();
    if (count === 0) {
      console.log("No internships found. Seeding one...");
      const dummy = new Internship({
        title: "Frontend Developer Intern",
        company: "Tech Corp",
        location: "Work from Home",
        stipend: "10,000 /month",
        duration: "3 Months",
        category: "Engineering",
        aboutCompany: "We are an awesome tech company.",
        aboutInternship: "Build cool React features.",
        whoCanApply: "Anyone who knows React",
        perks: "Certificate, LOR",
        additionalInfo: "Flexible hours",
        numberOfOpening: 5,
        startDate: "Immediately"
      });
      await dummy.save();
      console.log("Successfully seeded 1 internship!");
    } else {
      console.log(`Found ${count} internships. Database is already seeded.`);
    }
  } catch (error) {
    console.error("Database connection or seeding failed:");
    console.error(error.message);
  } finally {
    mongoose.connection.close();
  }
}
seed();
