// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

export function init(list) {
  list._idleNext = list;
  list._idlePrev = list;

  return list;
}

// Show the most idle item.
export function peek(list) {
  if (list._idlePrev === list) {
    return null;
  }

  return list._idlePrev;
}

// Remove an item from its list.
export function remove(item) {
  if (item._idleNext) {
    item._idleNext._idlePrev = item._idlePrev;
  }

  if (item._idlePrev) {
    item._idlePrev._idleNext = item._idleNext;
  }

  item._idleNext = null;
  item._idlePrev = null;
}

// Remove an item from its list and place at the end.
export function append(list, item) {
  if (item._idleNext || item._idlePrev) {
    remove(item);
  }

  // Items are linked  with _idleNext -> (older) and _idlePrev -> (newer).
  // Note: This linkage (next being older) may seem counter-intuitive at first.
  item._idleNext = list._idleNext;
  item._idlePrev = list;

  // The list _idleNext points to tail (newest) and _idlePrev to head (oldest).
  list._idleNext._idlePrev = item;
  list._idleNext = item;
}

export function isEmpty(list) {
  return list._idleNext === list;
}

export default {
  init,
  peek,
  remove,
  append,
  isEmpty,
};