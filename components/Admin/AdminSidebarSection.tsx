import React from "react";

const AdminSidebarSection = () => {
  return (
    <div>
      <h2 className="font-bold text-base text-gray-900 mb-4">
        ファイルアップロード
      </h2>
      <nav className="flex flex-col space-y-1">
        <a
          href="#"
          className="block py-2 pl-5 text-sm font-medium text-gray-900 "
        >
          講師
        </a>
        <a
          href="#"
          className="block py-2 pl-5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          生徒
        </a>
      </nav>
    </div>
  );
};

export default AdminSidebarSection;
