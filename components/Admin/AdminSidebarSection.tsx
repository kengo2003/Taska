const AdminSidebarSection = () => {
  return (
    <div>
      <h2 className="font-bold text-base text-gray-900 pl-5 mb-4">メニュー</h2>
      <nav className="flex flex-col space-y-1">
        <a
          href="/admin"
          className="block py-2 pl-5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ファイルアップロード
        </a>
        <a
          href="/admin/register"
          className="block py-2 pl-5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          利用者登録
        </a>
      </nav>
    </div>
  );
};

export default AdminSidebarSection;
