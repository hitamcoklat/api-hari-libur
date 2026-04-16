///<reference lib="dom" />
import { DOMParser } from '@b-fuze/deno-dom'
import { MONTH_NAME } from '@/constants/month.ts'

const fetcher = async (year: string) => {
  const response = await fetch(`https://tanggalans.com/kalender-${year}/`, {
    headers: {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "cache-control": "no-cache",
      "pragma": "no-cache",
      "sec-ch-ua": '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }

  return await response.text();
}

export const crawler = async (year: string) => {
  const html = await fetcher(year);
  const dom = new DOMParser().parseFromString(html, 'text/html');

  if (!dom) throw new Error('Failed to parse DOM');

  console.log('Sample Element:', dom.querySelector('.kal-title-link')?.outerHTML);

  // Selector yang lebih akurat berdasarkan HTML tanggalans.com
  const monthBlocks = dom.querySelectorAll('.kalender-indo');

  return Array.from(monthBlocks).flatMap((block) => {
    // Ambil nama bulan (misal: "Januari 2026")
    const monthTitle = block.querySelector('.kal-title-link')?.textContent.trim() || "";
    const monthName = monthTitle.split(' ')[0];
    const month = MONTH_NAME[monthName as keyof typeof MONTH_NAME];

    // Ambil daftar libur di dalam blok bulan tersebut
    const holidays = block.querySelectorAll('.kal-libur-list li');

    return Array.from(holidays).flatMap((holiday) => {
      const dayNode = holiday.querySelector('.kal-libur-day');
      const dayRaw = dayNode?.textContent.trim() || "";
      
      // Ambil nama libur dengan menghapus teks tanggalnya
      const name = holiday.textContent.replace(dayRaw, '').trim();
      
      // Deteksi Cuti Bersama
      const isCutiBersama = name.toLowerCase().includes("cuti bersama");

      // Logic untuk menangani rentang tanggal (misal: "21-22")
      if (dayRaw.includes('-')) {
        const [start, end] = dayRaw.split('-').map(Number);
        return Array.from({ length: end - start + 1 }, (_, i) => ({
          date: `${year}-${month}-${(start + i).toString().padStart(2, '0')}`,
          name: name,
          type: isCutiBersama ? "Cuti Bersama" : "Libur Nasional"
        }));
      }

      return {
        date: `${year}-${month}-${dayRaw.padStart(2, '0')}`,
        name: name,
        type: isCutiBersama ? "Cuti Bersama" : "Libur Nasional"
      };
    });
  });
};
