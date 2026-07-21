// Number formatting with German comma decimal separator

export const formatTemp = (value: number | null): string => {
  if (value === null) return "--°";
  return value.toFixed(1).replace(".", ",") + "°";
};

export const formatHumidity = (value: number | null): string => {
  if (value === null) return "--%";
  return Math.round(value) + "%";
};

export const formatEnergy = (value: number | null): string => {
  if (value === null) return "-- W";
  return value.toFixed(0).replace(".", ",") + " W";
};

export const formatEnergyKwh = (value: number | null): string => {
  if (value === null) return "-- kWh";
  return value.toFixed(1).replace(".", ",") + " kWh";
};

export const formatEnergy1 = (value: number | null): string => {
  if (value === null) return "--";
  return value.toFixed(0).replace(".", ",");
};

export const formatEnergyKwh1 = (value: number | null): string => {
  if (value === null) return "--";
  return value.toFixed(1).replace(".", ",");
};
