import Link from "next/link";
import { FcHome } from "react-icons/fc";
import { GiFlatPawPrint } from "react-icons/gi";
import { FcBusinessman } from "react-icons/fc";
import { FcBinoculars } from "react-icons/fc";


export default function Header() {
    return (
        <header className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4  items-center grid grid-cols-2 gap-4">
            <h1 className="text-3xl font-bold flex items-center gap-2"> <GiFlatPawPrint className="text-4xl" />Club Can-Pestre</h1>
            <div className="flex justify-end gap-4 font-semibold text-xl">
                        <Link href="/" className="hover:text-gray-300 cursor-pointer transition-all duration-300 hover:scale-105 flex gap-3 items-center justify-center">
                        <FcHome />
                        <p>Incio</p>
                        </Link>
                        <Link href="/pets" className="hover:text-gray-300 cursor-pointer transition-all duration-300 hover:scale-105 flex gap-3 items-center justify-center">
                        <GiFlatPawPrint />
                        <p>Mascotas</p>
                        </Link>
                        <Link href="/owners" className="hover:text-gray-300 cursor-pointer transition-all duration-300 hover:scale-105 flex gap-3 items-center justify-center">
                        <FcBusinessman />
                        <p>Dueños</p>
                        </Link>
                        <Link href="/location" className="hover:text-gray-300 cursor-pointer transition-all duration-300 hover:scale-105 flex gap-3 items-center justify-center">
                        <FcBinoculars />
                        <p>Ubicación</p>
                        </Link>
                    
            </div>
        </header>
    )
}
