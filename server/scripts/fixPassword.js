require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const bcrypt   = require("bcryptjs");
const supabase = require("../supabase");

const users = [
  { email:"alice@taskivo.com",  password:"alice123"  },
  { email:"ben@taskivo.com",    password:"ben123"    },
  { email:"carla@taskivo.com",  password:"carla123"  },
  { email:"mia@taskivo.com",    password:"mia123"    },
  { email:"dan@taskivo.com",    password:"dan123"    },
  { email:"eva@taskivo.com",    password:"eva123"    },
  { email:"frank@taskivo.com",  password:"frank123"  },
  { email:"grace@taskivo.com",  password:"grace123"  },
];

(async () => {
  console.log("Updating passwords in Supabase...\n");
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    const { error } = await supabase
      .from("users")
      .update({ password_hash: hash })
      .eq("email", u.email);
    if (error) {
      console.log(`❌ ${u.email} — ${error.message}`);
    } else {
      console.log(`✅ ${u.email} updated`);
    }
  }
  console.log("\nDone! Try logging in now.");
})();