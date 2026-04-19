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

import { ConfigRanking, RespuestaRanking } from "./ranking/Schema";
import { VoterRanking } from "./ranking/Voter";
import { ProjectorRanking } from "./ranking/Projector";
import { agregarRanking } from "./ranking/agregar";

import { ConfigNubePalabras, RespuestaNubePalabras } from "./nube-palabras/Schema";
import { VoterNubePalabras } from "./nube-palabras/Voter";
import { ProjectorNubePalabras } from "./nube-palabras/Projector";
import { agregarNubePalabras } from "./nube-palabras/agregar";

import { ConfigRespuestaAbierta, RespuestaRespuestaAbierta } from "./respuesta-abierta/Schema";
import { VoterRespuestaAbierta } from "./respuesta-abierta/Voter";
import { ProjectorRespuestaAbierta } from "./respuesta-abierta/Projector";
import { agregarRespuestaAbierta } from "./respuesta-abierta/agregar";

export const REGISTRY_PREGUNTAS = {
  OPCION_MULTIPLE: {
    schemaConfig: ConfigOpcionMultiple,
    schemaRespuesta: RespuestaOpcionMultiple,
    Voter: VoterOpcionMultiple,
    Projector: ProjectorOpcionMultiple,
    agregar: agregarOpcionMultiple,
    necesitaOpciones: true,
  },
  SI_NO: {
    schemaConfig: ConfigSiNo,
    schemaRespuesta: RespuestaSiNo,
    Voter: VoterSiNo,
    Projector: ProjectorSiNo,
    agregar: agregarSiNo,
    necesitaOpciones: false, // se siembran automáticas
  },
  ESCALA: {
    schemaConfig: ConfigEscala,
    schemaRespuesta: RespuestaEscala,
    Voter: VoterEscala,
    Projector: ProjectorEscala,
    agregar: agregarEscala,
    necesitaOpciones: false,
  },
  RANKING: {
    schemaConfig: ConfigRanking,
    schemaRespuesta: RespuestaRanking,
    Voter: VoterRanking,
    Projector: ProjectorRanking,
    agregar: agregarRanking,
    necesitaOpciones: true,
  },
  NUBE_PALABRAS: {
    schemaConfig: ConfigNubePalabras,
    schemaRespuesta: RespuestaNubePalabras,
    Voter: VoterNubePalabras,
    Projector: ProjectorNubePalabras,
    agregar: agregarNubePalabras,
    necesitaOpciones: false,
  },
  RESPUESTA_ABIERTA: {
    schemaConfig: ConfigRespuestaAbierta,
    schemaRespuesta: RespuestaRespuestaAbierta,
    Voter: VoterRespuestaAbierta,
    Projector: ProjectorRespuestaAbierta,
    agregar: agregarRespuestaAbierta,
    necesitaOpciones: false,
  },
} as const;

export type TipoImplementado = keyof typeof REGISTRY_PREGUNTAS;
