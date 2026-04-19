import { ConfigOpcionMultiple, RespuestaOpcionMultiple } from "./opcion-multiple/Schema";
import { VoterOpcionMultiple } from "./opcion-multiple/Voter";
import { ProjectorOpcionMultiple } from "./opcion-multiple/Projector";
import { agregarOpcionMultiple } from "./opcion-multiple/agregar";

import { ConfigSiNo, RespuestaSiNo } from "./si-no/Schema";
import { VoterSiNo } from "./si-no/Voter";
import { ProjectorSiNo } from "./si-no/Projector";
import { agregarSiNo } from "./si-no/agregar";

import { ConfigEscala, RespuestaEscala } from "./escala/Schema";
import { VoterEscala } from "./escala/Voter";
import { ProjectorEscala } from "./escala/Projector";
import { agregarEscala } from "./escala/agregar";

export const REGISTRY_PREGUNTAS = {
  OPCION_MULTIPLE: {
    schemaConfig: ConfigOpcionMultiple,
    schemaRespuesta: RespuestaOpcionMultiple,
    Voter: VoterOpcionMultiple,
    Projector: ProjectorOpcionMultiple,
    agregar: agregarOpcionMultiple,
  },
  SI_NO: {
    schemaConfig: ConfigSiNo,
    schemaRespuesta: RespuestaSiNo,
    Voter: VoterSiNo,
    Projector: ProjectorSiNo,
    agregar: agregarSiNo,
  },
  ESCALA: {
    schemaConfig: ConfigEscala,
    schemaRespuesta: RespuestaEscala,
    Voter: VoterEscala,
    Projector: ProjectorEscala,
    agregar: agregarEscala,
  },
} as const;

export type TipoImplementado = keyof typeof REGISTRY_PREGUNTAS;
