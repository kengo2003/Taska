const Title = ({ text }: { text: string }) => {
  return (
    <h1 className="text-2xl font-bold text-gray-800 border-b-2 border-gray-300 inline-block pb-1 mb-4">
      {text}
    </h1>
  );
};

export default Title;
