import { record } from "./registry";

// A side-effect-only module: it exports nothing at all. Registering an audit
// sink, installing a polyfill and calling `configure()` on a client library all
// look like this.
record("audit");
