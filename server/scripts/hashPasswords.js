// Run this once to generate bcrypt hashes for seed users:
//   cd server && node scripts/hashPasswords.js
//
// Then copy the hashes into supabase_schema.sql

const bcrypt = require("bcryptjs");

const users = [
  { email: "alice@taskivo.com",  password: "alice123"  },
  { email: "ben@taskivo.com",    password: "ben123"    },
  { email: "carla@taskivo.com",  password: "carla123"  },
  { email: "mia@taskivo.com",    password: "mia123"    },
  { email: "dan@taskivo.com",    password: "dan123"    },
  { email: "eva@taskivo.com",    password: "eva123"    },
  { email: "frank@taskivo.com",  password: "frank123"  },
  { email: "grace@taskivo.com",  password: "grace123"  },
];

(async () => {
  console.log("Generating bcrypt hashes...\n");
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    console.log(`${u.email}`);
    console.log(`  hash: ${hash}\n`);
  }
  console.log("Copy these hashes into supabase_schema.sql, then run the SQL in Supabase.");
})();
