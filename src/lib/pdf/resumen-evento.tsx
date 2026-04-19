/**
 * Renderiza un PDF de resumen de evento usando @react-pdf/renderer.
 * Se ejecuta server-side; el endpoint lo convierte a stream y lo descarga.
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToStream,
} from "@react-pdf/renderer";
import { REGISTRY_PREGUNTAS } from "@/components/preguntas";
import { prisma } from "@/lib/db";

const styles = StyleSheet.create({
  page: {
    padding: 56,
    fontSize: 11,
    color: "#0F1F3A",
    fontFamily: "Helvetica",
  },
  masthead: {
    borderBottom: "1px solid #E5E1D8",
    paddingBottom: 12,
    marginBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  masteadBrand: {
    fontSize: 18,
    fontWeight: 600,
    color: "#0F1F3A",
  },
  masteadMeta: {
    fontSize: 8,
    color: "#64748B",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 10,
    color: "#64748B",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginTop: 18,
    marginBottom: 10,
    borderBottom: "1px solid #E5E1D8",
    paddingBottom: 6,
  },
  pregunta: {
    marginBottom: 18,
    paddingLeft: 4,
  },
  preguntaHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 6,
  },
  preguntaOrden: {
    width: 22,
    fontSize: 10,
    color: "#C62828",
    fontWeight: 700,
  },
  preguntaEnunciado: {
    flex: 1,
    fontSize: 12,
    fontWeight: 600,
  },
  meta: {
    fontSize: 8,
    color: "#64748B",
    marginLeft: 22,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 22,
    marginTop: 3,
    fontSize: 10,
  },
  resultLabel: { flex: 1 },
  resultValue: { fontWeight: 700 },
  barWrap: {
    marginLeft: 22,
    marginTop: 2,
    marginBottom: 3,
    height: 6,
    backgroundColor: "#F0EBDF",
    borderRadius: 2,
  },
  bar: { height: 6, backgroundColor: "#1E3A5F", borderRadius: 2 },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 56,
    right: 56,
    borderTop: "1px solid #E5E1D8",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  quote: {
    fontFamily: "Times-Italic",
    fontSize: 10,
    color: "#334155",
    marginLeft: 22,
    marginTop: 4,
    marginBottom: 4,
    borderLeft: "2px solid #C62828",
    paddingLeft: 8,
  },
});

type PreguntaData = Awaited<ReturnType<typeof cargarEventoCompleto>>["preguntas"][number];

async function cargarEventoCompleto(eventoId: string) {
  const evento = await prisma.evento.findUnique({
    where: { id: eventoId },
    include: {
      preguntas: {
        orderBy: { orden: "asc" },
        include: {
          opciones: { orderBy: { orden: "asc" } },
          votos: true,
        },
      },
      _count: { select: { invitados: true } },
    },
  });
  if (!evento) throw new Error("Evento no existe");
  return evento;
}

function ResultadoPorTipo({ p }: { p: PreguntaData }) {
  const impl = REGISTRY_PREGUNTAS[p.tipo as keyof typeof REGISTRY_PREGUNTAS];
  if (!impl) return <Text style={styles.meta}>(tipo sin implementar)</Text>;

  if (p.tipo === "NUBE_PALABRAS") {
    const agregado = (impl.agregar as (v: unknown) => { palabras: { texto: string; count: number }[] })(p.votos);
    return (
      <View>
        {agregado.palabras.slice(0, 20).map((w) => (
          <View key={w.texto} style={styles.resultRow}>
            <Text style={styles.resultLabel}>{w.texto}</Text>
            <Text style={styles.resultValue}>{w.count}</Text>
          </View>
        ))}
      </View>
    );
  }

  if (p.tipo === "RESPUESTA_ABIERTA") {
    const agregado = (impl.agregar as (v: unknown) => { respuestas: { texto: string; votoId: string }[] })(p.votos);
    return (
      <View>
        {agregado.respuestas.map((r) => (
          <Text key={r.votoId} style={styles.quote}>
            “{r.texto}”
          </Text>
        ))}
      </View>
    );
  }

  if (p.tipo === "ESCALA") {
    const config = impl.schemaConfig.parse(p.configuracion) as never;
    const agregado = (impl.agregar as (v: unknown, c: unknown) => { total: number; promedio: number; histograma: Record<number, number> })(p.votos, config);
    return (
      <View>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Promedio</Text>
          <Text style={styles.resultValue}>{agregado.promedio.toFixed(2)}</Text>
        </View>
        {Object.entries(agregado.histograma).map(([v, n]) => (
          <View key={v} style={styles.resultRow}>
            <Text style={styles.resultLabel}>{`Valor ${v}`}</Text>
            <Text style={styles.resultValue}>{n}</Text>
          </View>
        ))}
      </View>
    );
  }

  if (p.tipo === "RANKING") {
    const agregado = (impl.agregar as (v: unknown, o: unknown) => { ranked: { opcionId: string; texto: string; puntos: number; posicion: number; pct: number }[] })(p.votos, p.opciones);
    return (
      <View>
        {agregado.ranked.map((r) => (
          <View key={r.opcionId}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>{r.posicion}. {r.texto}</Text>
              <Text style={styles.resultValue}>{r.puntos} pts</Text>
            </View>
            <View style={styles.barWrap}>
              <View style={[styles.bar, { width: `${r.pct * 100}%` }]} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  // OPCION_MULTIPLE y SI_NO
  const agregado = (impl.agregar as (v: unknown, o: unknown) => { total: number; porOpcion?: Record<string, { opcionId: string; texto: string; votos: number; pct: number }>; si?: number; no?: number })(p.votos, p.opciones);
  if (p.tipo === "SI_NO") {
    const tot = agregado.total || 1;
    return (
      <View>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Sí</Text>
          <Text style={styles.resultValue}>{agregado.si} ({Math.round(((agregado.si ?? 0) / tot) * 100)}%)</Text>
        </View>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>No</Text>
          <Text style={styles.resultValue}>{agregado.no} ({Math.round(((agregado.no ?? 0) / tot) * 100)}%)</Text>
        </View>
      </View>
    );
  }
  // MC
  const entries = agregado.porOpcion ? Object.values(agregado.porOpcion) : [];
  return (
    <View>
      {entries.map((e) => (
        <View key={e.opcionId}>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>{e.texto}</Text>
            <Text style={styles.resultValue}>{e.votos} ({Math.round(e.pct * 100)}%)</Text>
          </View>
          <View style={styles.barWrap}>
            <View style={[styles.bar, { width: `${e.pct * 100}%` }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

function Resumen({ evento, appName }: { evento: Awaited<ReturnType<typeof cargarEventoCompleto>>; appName: string }) {
  const fecha = new Date().toLocaleDateString("es-DO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.masthead}>
          <Text style={styles.masteadBrand}>{appName}</Text>
          <Text style={styles.masteadMeta}>Resumen de evento · {fecha}</Text>
        </View>

        <Text style={styles.title}>{evento.nombre}</Text>
        <Text style={styles.subtitle}>
          {evento.modo === "VIVO" ? "Evento en vivo" : "Evento asíncrono"} · {evento.estado} ·{" "}
          {evento._count.invitados} invitado{evento._count.invitados === 1 ? "" : "s"} ·{" "}
          {evento.preguntas.length} pregunta{evento.preguntas.length === 1 ? "" : "s"}
        </Text>

        {evento.descripcion && (
          <Text style={{ fontSize: 10, color: "#334155", marginBottom: 18 }}>
            {evento.descripcion}
          </Text>
        )}

        <Text style={styles.sectionTitle}>Resultados por pregunta</Text>

        {evento.preguntas.map((p) => (
          <View key={p.id} style={styles.pregunta} wrap={false}>
            <View style={styles.preguntaHeader}>
              <Text style={styles.preguntaOrden}>{String(p.orden + 1).padStart(2, "0")}</Text>
              <Text style={styles.preguntaEnunciado}>{p.enunciado}</Text>
            </View>
            <Text style={styles.meta}>
              {p.tipo.replace(/_/g, " ")} · {p.votos.length} voto{p.votos.length === 1 ? "" : "s"} · {p.estado}
            </Text>
            <ResultadoPorTipo p={p} />
          </View>
        ))}

        <View style={styles.footer} fixed>
          <Text>{appName} · Licencia MIT</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function generarPdfResumenEvento(eventoId: string, appName: string) {
  const evento = await cargarEventoCompleto(eventoId);
  const stream = await renderToStream(<Resumen evento={evento} appName={appName} />);
  return { stream, evento };
}
