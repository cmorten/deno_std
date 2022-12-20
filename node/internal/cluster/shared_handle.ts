// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

import assert from "../assert.mjs";
import { _createSocketHandle } from "../dgram.ts";
import { UDP } from "../../internal_binding/udp_wrap.ts";
import { _createServerHandle } from "../../net.ts";
import type { Handle } from "../../net.ts";
import type { Message, Worker } from "./types.ts";

export class SharedHandle {
  key: string;
  workers: Map<number, Worker>;
  handle: UDP | Handle | null = null;
  errno = 0;

  constructor(
    key: string,
    address: string,
    { port, addressType, fd, flags }: Message,
  ) {
    this.key = key;
    this.workers = new Map();
    this.handle = null;
    this.errno = 0;

    let rval;

    if (addressType === "udp4" || addressType === "udp6") {
      rval = _createSocketHandle(address, port!, addressType, fd!, flags!);
    } else {
      rval = _createServerHandle(
        address,
        port!,
        addressType as number,
        fd,
        flags,
      );
    }

    if (typeof rval === "number") {
      this.errno = rval;
    } else {
      this.handle = rval;
    }
  }

  add(
    worker: Worker,
    send: (
      errno: number,
      reply: Record<string, unknown> | null,
      handle: UDP | Handle,
    ) => void,
  ) {
    assert(!this.workers.has(worker.id));
    this.workers.set(worker.id, worker);
    send(this.errno, null, this.handle!);
  }

  remove(worker: Worker) {
    if (!this.workers.has(worker.id)) {
      return false;
    }

    this.workers.delete(worker.id);

    if (this.workers.size !== 0) {
      return false;
    }

    this.handle!.close();
    this.handle = null;

    return true;
  }
}

export default SharedHandle;