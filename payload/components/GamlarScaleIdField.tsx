"use client";

import type { TextFieldClientComponent } from "payload";
import {
  FieldError,
  FieldLabel,
  SelectInput,
  useField,
  useFormFields,
} from "@payloadcms/ui";
import { useMemo } from "react";

import type { KeyMode } from "../../lib/types/content";
import {
  defaultGamlarScaleLabelForKeyMode,
  gamlarScaleOptionsAll,
  keyModeScaleMismatch,
} from "../../lib/music/key-mode-gamlar";

const KEY_MODES: readonly string[] = ["major", "natural", "harmonic", "melodic"];

function asKeyMode(value: unknown): KeyMode | undefined {
  return typeof value === "string" && KEY_MODES.includes(value) ? (value as KeyMode) : undefined;
}

/** Alan `tabs` içinde ama yolu düz: kardeş "keyMode" de aynı önekte. */
function siblingKeyModePath(path: string): string {
  const idx = path.lastIndexOf(".");
  return idx === -1 ? "keyMode" : `${path.slice(0, idx)}.keyMode`;
}

/**
 * "Gam kimliği" alanı — serbest metin yerine açılır liste.
 *
 * Alan veritabanında `text` kalıyor; yalnız panel girişi değişiyor. Bilerek
 * `select` alan tipine çevrilmedi: `select` Postgres'te enum sütunu açar ve
 * kataloğa eklenen her mod migration gerektirir.
 *
 * Liste bütün aileleri gösteriyor; ton modu listeyi daraltmıyor. Eskiden
 * daraltıyordu ve Aeolian'a ulaşmak için ton modu "Majör" seçiliyordu.
 * Ton moduyla gam karakteri çelişirse yalnız uyarı çıkıyor.
 */
export const GamlarScaleIdField: TextFieldClientComponent = ({ field, path }) => {
  const { disabled, errorMessage, setValue, showError, value } = useField<string>({ path });

  const keyModePath = siblingKeyModePath(path);
  const keyMode = useFormFields(([fields]) => asKeyMode(fields?.[keyModePath]?.value));

  const options = useMemo(() => gamlarScaleOptionsAll(), []);
  const defaultLabel = defaultGamlarScaleLabelForKeyMode(keyMode);
  const current = typeof value === "string" ? value : "";
  const warning = current ? keyModeScaleMismatch(keyMode, current) : null;

  return (
    <div className="field-type text">
      <FieldLabel label={field?.label ?? "Gam kimliği"} path={path} />
      <SelectInput
        Error={<FieldError message={errorMessage} path={path} showError={showError} />}
        description={`Boş bırakılırsa ton modunun varsayılanı kullanılır: ${defaultLabel}.`}
        isClearable
        name="gamlarScaleId"
        onChange={(option) => {
          const picked = Array.isArray(option) ? option[0] : option;
          setValue(picked && "value" in picked ? String(picked.value) : "");
        }}
        options={options}
        path={path}
        placeholder={`Varsayılan — ${defaultLabel}`}
        readOnly={disabled}
        showError={showError}
        value={current}
      />
      {warning ? (
        <p role="status" style={{ color: "var(--theme-warning-600)", marginTop: 6 }}>
          ⚠ {warning}
        </p>
      ) : null}
    </div>
  );
};
