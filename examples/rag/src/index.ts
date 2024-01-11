import { markdownChaining } from "./chaining.js"
import { markdownLoader } from "./load.js"

const noop = async () => {
  await markdownChaining()
}

noop()