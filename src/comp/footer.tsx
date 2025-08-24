export default function Footer() {
    return (
          <footer className="border-t border-gray-200 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          &copy; {new Date().getFullYear()} Agromat. All rights reserved.
        </div>
      </footer>
    )
}