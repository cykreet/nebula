import { loadConfig } from "@ryanke/venera";
import { z } from "zod";

const Config = z.object({
  verifyToken: z.string().min(15),
  whatsappToken: z.string(),
  contentful: z.object({
    spaceId: z.string(),
    token: z.string(),
  }),
  initiators: z.array(z.string()).nonempty().default(["hello", "hi", "help"]),
});

const data = loadConfig("nebula");
const validate = Config.safeParse(data);
if (!validate.success) {
  const error = validate.error;
  console.error(error.issues);
  process.exit(1);
}

const config = validate.data;
export { config };
