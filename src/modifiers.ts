import * as dot from "@chronocide/dot-obj";
import { AkivaDBError } from "./errorHandler";

import { INVALID_MODIFIER, NOT_ARRAY, NOT_NUMBER } from "./errors";
import { KeysOf, Projection, Modifiers } from "./types";
import { hasModifier } from "./validators";

/**
 * Projects the selected field(s).
 * @param {T} doc
 * @param {P} projection
 * @returns {Projection<T,P>} doc
 * @todo Add `_id` by default
 */
export const project = <T extends object, P extends KeysOf<T>>(
  doc: T,
  projection: P
) => {
  if (!Array.isArray(projection))
    throw new AkivaDBError(NOT_ARRAY(projection), 2);
  return projection.reduce(
    (acc, key) => ({
      ...acc,
      [key]: doc[key],
    }),
    {} as Projection<T, P>
  );
};

/**
 * Modifies the document based on the provided modifier(s).
 * @param {T} doc
 * @param {Partial<Modifiers>} modifiers
 * @returns {T} doc
 */
export const modify = <T extends object>(
  doc: T,
  modifiers: Partial<Modifiers>
): T => {
  Object.entries(modifiers).forEach(([modifier, value]) => {
    switch (modifier) {
      case "$push":
        if (!hasModifier(modifier, value)) break;
        Object.entries(value).forEach((entry) => {
          const cur = dot.get(doc, entry[0]);
          if (!Array.isArray(cur)) throw new AkivaDBError(NOT_ARRAY(cur), 2);
          dot.set(doc, entry[0], [...cur, entry[1]]);
        });
        break;
      case "$set":
        if (!hasModifier(modifier, value)) break;
        Object.entries(value).forEach((entry) =>
          dot.set(doc, entry[0], entry[1])
        );
        break;
      case "$add":
        if (!hasModifier(modifier, value)) break;
        Object.entries(value).forEach((entry) => {
          const cur = dot.get(doc, entry[0]);
          if (typeof cur !== "number")
            throw new AkivaDBError(NOT_NUMBER(cur), 2);
          dot.set(doc, entry[0], cur + entry[1]);
        });
        break;
      default:
        throw new AkivaDBError(INVALID_MODIFIER(modifier), 1);
    }
  });

  return doc;
};
