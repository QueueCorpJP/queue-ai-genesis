
import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Container } from '@/components/ui/container';

const Terms = () => {
  useEffect(() => {
    document.title = "利用規約 | Queue株式会社";
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <Container className="py-16 md:py-24">
          <div className="max-w-3xl mx-auto prose">
            <h1 className="text-3xl md:text-4xl font-bold mb-8">利用規約</h1>
            
            <p className="mb-6">
              この利用規約（以下「本規約」）は、Queue株式会社（以下「当社」）が提供するサービス（以下「本サービス」）の利用条件を定めるものです。本サービスをご利用されるお客様（以下「ユーザー」）は、本規約に同意したものとみなされます。
            </p>

            <h2 className="text-2xl font-semibold mt-10 mb-4">第1条（適用範囲）</h2>
            <p>本規約は、ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されます。</p>

            <h2 className="text-2xl font-semibold mt-10 mb-4">第2条（利用登録）</h2>
            <ol className="list-decimal pl-6">
              <li className="mb-2">本サービスの利用を希望する者（以下「登録希望者」）は、当社の定める方法によって利用登録を申請し、当社がこれを承認することによって利用登録が完了するものとします。</li>
              <li className="mb-2">当社は、登録希望者が以下の各号のいずれかに該当する場合には、利用登録の申請を承認しないことがあります。</li>
              <ul className="list-disc pl-6 mb-4">
                <li>登録申請の内容に虚偽、誤記または記載漏れがあった場合</li>
                <li>登録希望者が過去に本規約違反等により、利用登録の取消処分を受けたことがある場合</li>
                <li>その他当社が利用登録を適当でないと判断した場合</li>
              </ul>
            </ol>

            <h2 className="text-2xl font-semibold mt-10 mb-4">第3条（ユーザーIDおよびパスワードの管理）</h2>
            <ol className="list-decimal pl-6">
              <li className="mb-2">ユーザーは、自己の責任において、本サービスのユーザーIDおよびパスワードを適切に管理するものとします。</li>
              <li className="mb-2">ユーザーは、いかなる場合にも、ユーザーIDおよびパスワードを第三者に譲渡または貸与し、もしくは第三者と共用することはできません。</li>
              <li className="mb-2">ユーザーIDとパスワードの管理不十分、使用上の過誤、第三者の使用等による損害の責任はユーザーが負うものとし、当社は一切の責任を負いません。</li>
            </ol>

            <h2 className="text-2xl font-semibold mt-10 mb-4">第4条（禁止事項）</h2>
            <p>ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
            <ul className="list-disc pl-6 mb-4">
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>当社のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
              <li>本サービスの運営を妨害するおそれのある行為</li>
              <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
              <li>不正アクセスをし、またはこれを試みる行為</li>
              <li>他のユーザーに成りすます行為</li>
              <li>当社のサービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為</li>
              <li>その他、当社が不適切と判断する行為</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-10 mb-4">第5条（本サービスの提供の停止等）</h2>
            <ol className="list-decimal pl-6">
              <li className="mb-2">当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。</li>
              <ul className="list-disc pl-6 mb-4">
                <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
                <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
                <li>コンピュータまたは通信回線等が事故により停止した場合</li>
                <li>その他、当社が本サービスの提供が困難と判断した場合</li>
              </ul>
              <li className="mb-2">当社は、本サービスの提供の停止または中断により、ユーザーまたは第三者が被ったいかなる不利益または損害についても、一切の責任を負わないものとします。</li>
            </ol>

            <h2 className="text-2xl font-semibold mt-10 mb-4">第6条（著作権）</h2>
            <ol className="list-decimal pl-6">
              <li className="mb-2">ユーザーは、自ら著作権を有するか、または必要な権利者の許諾を得た文章、画像等の情報のみ、本サービスを利用して投稿することができるものとします。</li>
              <li className="mb-2">ユーザーが本サービスを利用して投稿した文章、画像等の著作権については、当該ユーザーその他既存の権利者に留保されるものとします。</li>
              <li className="mb-2">前項本文の定めるものを除き、本サービスおよび本サービスに関連する一切の情報についての著作権およびその他の知的財産権はすべて当社または当社にその利用を許諾した権利者に帰属し、ユーザーは無断で複製、譲渡、貸与、翻訳、改変、転載、公衆送信（送信可能化を含む）、伝送、配布、出版、営業使用等をしてはならないものとします。</li>
            </ol>

            <h2 className="text-2xl font-semibold mt-10 mb-4">第7条（利用規約の変更）</h2>
            <ol className="list-decimal pl-6">
              <li className="mb-2">当社は、必要と判断した場合には、ユーザーに通知することなく本規約を変更することができるものとします。</li>
              <li className="mb-2">当社が別途定める場合を除いて、変更後の本規約は、本ウェブサイトに掲載したときから効力を生じるものとします。</li>
            </ol>

            <p className="mt-12 text-center text-sm text-gray-500">最終更新日: 2024年5月1日</p>
          </div>
        </Container>
      </main>
      
      <Footer />
    </div>
  );
};

export default Terms;
