import Link from 'next/link'

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-300 mb-8 shimmer-text">Your Profile</h1>
        
        <div className="bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-blue-200 shimmer-text">Personal Information</h3>
          </div>
          <div className="border-t border-gray-700">
            <dl>
              <div className="bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-400">Full name</dt>
                <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">John Doe</dd>
              </div>
              <div className="bg-gray-900 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-400">Email address</dt>
                <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">johndoe@example.com</dd>
              </div>
              <div className="bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-400">Job applications</dt>
                <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">12</dd>
              </div>
              <div className="bg-gray-900 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-400">Interviews scheduled</dt>
                <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">3</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

DO THIS: https://www.youtube.com/watch?v=iaxekGfUzvk&t=5327s