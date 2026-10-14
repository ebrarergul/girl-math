/**
 * Web için tema: uygulama şimdilik sadece açık temayı kullanıyor
 * (app.json: "userInterfaceStyle": "light").
 * Karanlık mod eklenince burası yeniden düzenlenecek.
 */
export function useColorScheme() {
  return 'light' as const;
}
