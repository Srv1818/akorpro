"use client";

import type { TextFieldClientComponent } from "payload";
import {
  FieldError,
  FieldLabel,
  SelectInput,
  useField,
  useFormFields,
} from "@payloadcms/ui";
import { useEffect, useMemo } from "react";

import type { KeyMode } from "../../lib/types/content";
import {
  defaultGamlarScaleLabelForKeyMode,
  gamlarScaleOptionsForKeyMode,
  realignGamlarScaleIdToKeyMode,
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
 * `select` alan tipine çevrilmedi: `select` Postgres'te enum sütunu açar,
 * kataloğa eklenen her mod migration gerektirir ve asıl istenen "ton moduna
 * göre daralan liste" enum ile zaten yapılamaz.
 *
 * Aynı aile kuralı sunucu tarafında alanın `validate` fonksiyonunda da var;
 * bu bileşen kolaylık, doğrulama değil.
 */
export const GamlarScaleIdField: TextFieldClientComponent = ({ field, path }) => {
  const { disabled, errorMessage, setValue, showError, value } = useField<string>({ path });

  const keyModePath = siblingKeyModePath(path);
  /** String tutuluyor: `undefined` bağımlılık dizisinde kararsız davranıyor. */
  const keyModeKey = useFormFields(
    ([fields]) => asKeyMode(fields?.[keyModePath]?.value) ?? "",
  ) as KeyMode | "";
  const keyMode = keyModeKey || undefined;

  const options = useMemo(() => gamlarScaleOptionsForKeyMode(keyMode), [keyMode]);
  const defaultLabel = defaultGamlarScaleLabelForKeyMode(keyMode);
  const current = typeof value === "string" ? value : "";

  /**
   * Ton modu değişince eldeki mod başka aileye düşüyordu ve sayfa sessizce
   * varsayılana dönüyordu. Burada sunucudaki `beforeValidate` ile birebir aynı
   * onarım yapılıyor: Phrygian seçiliyken majörden doğal minöre geçince seçim
   * silinmiyor, `nm-phrygian` oluyor. Karşılığı yoksa temizleniyor.
   *
   * Bağımlılıklar bilerek yalnız ilkel değer: `options` her render'da yeni bir
   * dizi ve React'ın bağımlılık karşılaştırmasını her seferinde tetikliyordu.
   */
  useEffect(() => {
    if (!current) return;
    const next = realignGamlarScaleIdToKeyMode(current, keyModeKey || undefined) ?? "";
    if (next !== current) setValue(next);
  }, [current, keyModeKey, setValue]);

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
    </div>
  );
};
