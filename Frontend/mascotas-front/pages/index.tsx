import Header from "../app/components/header";

export default function Home() {
  return (
    <div className="">
      <Header />
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-4xl font-bold text-center ">Bienvenido a la página de inicio</h1>
      </div>
    </div>
  );
}
