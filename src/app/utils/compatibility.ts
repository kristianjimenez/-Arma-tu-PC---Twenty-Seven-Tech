import { PCComponent, ComponentCategory, PCBuild } from '../types/pc-component';

type Parts = { [key in ComponentCategory]?: PCComponent };

/**
 * Devuelve el motivo por el que `candidate` NO es compatible con lo que ya
 * está elegido, o null si todo está bien. Se usa para (a) avisar en las
 * tarjetas antes de agregar y (b) validar el build completo.
 */
export function getConflict(candidate: PCComponent, parts: Parts): string | null {
  const { cpu, motherboard, ram, gpu, power, case: pcCase } = parts;

  switch (candidate.category) {
    case 'cpu':
      if (motherboard && candidate.socket !== motherboard.socket)
        return `Socket ${candidate.socket}: tu placa es ${motherboard.socket}`;
      break;
    case 'motherboard':
      if (cpu && candidate.socket !== cpu.socket)
        return `Socket ${candidate.socket}: tu CPU es ${cpu.socket}`;
      if (ram && candidate.ramType !== ram.ramType)
        return `Usa ${candidate.ramType}: tu RAM es ${ram.ramType}`;
      if (pcCase?.supportedForms && candidate.formFactor && !pcCase.supportedForms.includes(candidate.formFactor))
        return `Formato ${candidate.formFactor}: tu case no lo soporta`;
      break;
    case 'ram':
      if (motherboard && candidate.ramType !== motherboard.ramType)
        return `${candidate.ramType}: tu placa usa ${motherboard.ramType}`;
      break;
    case 'gpu':
      if (power?.wattage && candidate.minWattage && power.wattage < candidate.minWattage)
        return `Requiere fuente de ${candidate.minWattage}W o más (la tuya es ${power.wattage}W)`;
      break;
    case 'power':
      if (gpu?.minWattage && candidate.wattage && candidate.wattage < gpu.minWattage)
        return `${candidate.wattage}W no alcanza para tu GPU (mín. ${gpu.minWattage}W)`;
      break;
    case 'case':
      if (motherboard?.formFactor && candidate.supportedForms && !candidate.supportedForms.includes(motherboard.formFactor))
        return `No cabe tu placa ${motherboard.formFactor}`;
      break;
  }
  return null;
}

export function validateCompatibility(build: PCBuild): string[] {
  const issues: string[] = [];
  const { components } = build;
  const { cpu, motherboard, ram, gpu, power, case: pcCase } = components;

  if (cpu && motherboard && cpu.socket !== motherboard.socket) {
    issues.push(`El socket del CPU (${cpu.socket}) no coincide con la placa base (${motherboard.socket}).`);
  }
  if (ram && motherboard && ram.ramType !== motherboard.ramType) {
    issues.push(`La RAM es ${ram.ramType} pero la placa base usa ${motherboard.ramType}.`);
  }
  if (gpu?.minWattage && power?.wattage && power.wattage < gpu.minWattage) {
    issues.push(`La GPU recomienda una fuente de ${gpu.minWattage}W y la elegida es de ${power.wattage}W.`);
  }
  if (pcCase?.supportedForms && motherboard?.formFactor && !pcCase.supportedForms.includes(motherboard.formFactor)) {
    issues.push(`La placa base (${motherboard.formFactor}) no cabe en el case seleccionado.`);
  }
  return issues;
}

export function calculateTotal(components: Parts): number {
  return Object.values(components).reduce((total, c) => total + (c?.price || 0), 0);
}

export function isCompatible(build: PCBuild): boolean {
  return validateCompatibility(build).length === 0;
}
