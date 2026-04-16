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

  const months = dom?.querySelectorAll('#main article ul')

  if (!months) {
    throw new Error('Failed to parse DOM')
  }

  return Array.from(months).flatMap((item) => {
    const [monthName, year] = item
      .querySelector<HTMLAnchorElement>('li:first-child a')
      ?.getAttribute('href')
      ?.split('-') || []

    const month = MONTH_NAME[monthName as keyof typeof MONTH_NAME]

    return Array.from(
      item.querySelectorAll('li:last-child table tr'),
    )
      .flatMap((holiday) => {
        const day = holiday.querySelector<HTMLTableCellElement>('td:first-child')?.textContent.trim()
        const name = holiday.querySelector<HTMLTableCellElement>('td:last-child')?.textContent.trim() as string

        if (day && day.includes('-')) {
          const split = day.split('-', 2)
          const start = Number(split[0])
          const end = Number(split[1])

          return Array.from({ length: end - start + 1 })
            .fill(start)
            .flatMap((value, index) => {
              return {
                date: `${year}-${month}-${(Number(value) + index).toString().padStart(2, '0')}`,
                name,
              }
            })
        }

        return {
          date: `${year}-${month}-${day?.padStart(2, '0')}`,
          name,
        }
      })
  })
}
