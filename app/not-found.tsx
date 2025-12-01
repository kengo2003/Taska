import Link from "next/link";

export default function NotFound() {
  return (
    <div>
      <h2>ページが見つかりません</h2>
      <p>お探しのページは削除されたか、URLが間違っている可能性があります。</p>
      <Link href="/">ホームに戻る</Link>
    </div>
  );
}
