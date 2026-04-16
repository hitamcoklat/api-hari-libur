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
  console.log("HTML terambil, karakter pertama:", html.substring(0, 100)); // Cek apakah HTML-nya beneran ada

  const dom = new DOMParser().parseFromString(html, 'text/html');
  if (!dom) {
    console.error("DOM Gagal di parse!");
  } else {
    const testNode = dom.querySelector('article');
    console.log("Apakah ada tag article?", !!testNode);
  }

  // Cari semua blok bulan
  const monthBlocks = dom.querySelectorAll('.kalender-indo');

  return Array.from(monthBlocks).flatMap((block) => {
    // Ambil nama bulan dari judul link
    const monthTitle = block.querySelector('.kal-title-link')?.textContent.trim(); 
    // Contoh: "Januari 2026"
    
    // Ambil list libur di bawahnya
    const holidayItems = block.querySelectorAll('.kal-libur-list li');

    return Array.from(holidayItems).map((li) => {
      const dayText = li.querySelector('.kal-libur-day')?.textContent.trim();
      const nameText = li.textContent.replace(dayText || '', '').trim();

      return {
        date: dayText, // Perlu logic split jika rentang seperti "21-22"
        month: monthTitle,
        name: nameText,
        // Deteksi Cuti Bersama dari class atau teks
        is_cuti_bersama: nameText.toLowerCase().includes("cuti bersama")
      };
    });
  });
}
