import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Link href="/login" className='font-bold'>
        Login 
      </Link>

      <Link href="/playground" className='font-bold'>
        Playground
      </Link>
    </main>
  )
}
