import React from "react";

const Title = ({ text }: { text: string }) => {
  return (
    <div className="underline underline-offset-8 decoration-2">
      <h1 className="text-4xl">{text}</h1>
    </div>
  );
};

export default Title;
