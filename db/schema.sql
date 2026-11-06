-- Arma tu PC · Twenty Seven Tech · esquema PostgreSQL
CREATE TABLE IF NOT EXISTS usuario (
  id           SERIAL PRIMARY KEY,
  nombre       TEXT NOT NULL,
  correo       TEXT NOT NULL UNIQUE,            -- el administrador usa el usuario "admin"
  clave_hash   TEXT NOT NULL,                   -- scrypt$sal$hash (nunca la clave en texto)
  rol          TEXT NOT NULL DEFAULT 'cliente' CHECK (rol IN ('cliente','admin')),
  creado_en    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sesion (
  token_hash   TEXT PRIMARY KEY,                -- SHA-256 del token que recibe el navegador
  usuario_id   INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  expira_en    TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS sesion_usuario_idx ON sesion(usuario_id);

CREATE TABLE IF NOT EXISTS componente (
  id                   TEXT PRIMARY KEY,
  categoria            TEXT NOT NULL CHECK (categoria IN ('cpu','motherboard','ram','gpu','storage','power','case')),
  marca                TEXT NOT NULL,
  nombre               TEXT NOT NULL,
  precio               NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  especificaciones     TEXT NOT NULL DEFAULT '',
  existencias          INTEGER NOT NULL DEFAULT 0 CHECK (existencias >= 0),
  calificacion         SMALLINT NOT NULL DEFAULT 4,
  etiqueta             TEXT,
  activo               BOOLEAN NOT NULL DEFAULT TRUE,
  -- atributos de compatibilidad
  socket               TEXT,
  chipset              TEXT,
  tipo_ram             TEXT,
  vatios               INTEGER,
  formato              TEXT,
  formatos_soportados  TEXT[],
  vatios_minimos       INTEGER,
  gpu_integrada        TEXT
);

CREATE TABLE IF NOT EXISTS imagen (
  componente_id  TEXT PRIMARY KEY REFERENCES componente(id) ON DELETE CASCADE,
  tipo_mime      TEXT NOT NULL,
  datos          BYTEA NOT NULL,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS equipo_preconfigurado (
  id          TEXT PRIMARY KEY,
  nombre      TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  insignia    TEXT,
  orden       INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS equipo_pieza (
  equipo_id      TEXT NOT NULL REFERENCES equipo_preconfigurado(id) ON DELETE CASCADE,
  categoria      TEXT NOT NULL,
  componente_id  TEXT NOT NULL REFERENCES componente(id),
  PRIMARY KEY (equipo_id, categoria)
);

CREATE TABLE IF NOT EXISTS pedido (
  id                SERIAL PRIMARY KEY,
  codigo            TEXT NOT NULL UNIQUE,       -- T27-AAMMDD-XXXX
  usuario_id        INTEGER REFERENCES usuario(id) ON DELETE SET NULL,
  cliente           TEXT NOT NULL,
  telefono          TEXT NOT NULL,
  correo            TEXT,
  metodo_pago       TEXT NOT NULL CHECK (metodo_pago IN ('whatsapp','local')),
  nota              TEXT,
  subtotal          NUMERIC(10,2) NOT NULL,
  iva               NUMERIC(10,2) NOT NULL,
  total             NUMERIC(10,2) NOT NULL,
  tasa_bcv          NUMERIC(14,4),               -- tasa vigente al momento del pedido
  estado            TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','atendida','vendida','cancelada')),
  stock_descontado  BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pedido_estado_idx ON pedido(estado, creado_en DESC);

CREATE TABLE IF NOT EXISTS pedido_item (
  id             SERIAL PRIMARY KEY,
  pedido_id      INTEGER NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,
  componente_id  TEXT NOT NULL REFERENCES componente(id),
  categoria      TEXT NOT NULL,
  nombre         TEXT NOT NULL,
  precio         NUMERIC(10,2) NOT NULL
);
CREATE INDEX IF NOT EXISTS pedido_item_pedido_idx ON pedido_item(pedido_id);

CREATE TABLE IF NOT EXISTS build_guardado (
  id          SERIAL PRIMARY KEY,
  usuario_id  INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  piezas      JSONB NOT NULL,                    -- { "cpu": "cpu-1", ... }
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS build_usuario_idx ON build_guardado(usuario_id, creado_en DESC);

CREATE TABLE IF NOT EXISTS evento (
  id         SERIAL PRIMARY KEY,
  tipo       TEXT NOT NULL CHECK (tipo IN ('share','banner')),
  creado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasa_cambio (
  id         SERIAL PRIMARY KEY,
  fuente     TEXT NOT NULL DEFAULT 'BCV',
  tasa       NUMERIC(14,4) NOT NULL,             -- bolívares por USD
  publicada  TIMESTAMPTZ,                         -- fecha que reporta la fuente
  consultada TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tasa_consultada_idx ON tasa_cambio(consultada DESC);
