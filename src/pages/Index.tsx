import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <div className="flex-grow flex items-center justify-center">
        <div className="text-center p-4">
          <h1 className="text-4xl font-bold mb-4">Welcome to Your Blank App</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Start building your amazing project here!
          </p>
        </div>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;