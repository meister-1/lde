const fs = jest.genMockFromModule('fs-sync')

let mockFiles = Object.create(null)

function exists(filePath) {
  return (filePath in mockFiles)
}

function read(filePath) {
  return mockFiles[filePath] || []
}

function write(filePath, content) {
  mockFiles[filePath] = content
}

fs.__setMockFiles = mockFiles
fs.read = read
fs.write = write
fs.exists = exists

module.exports = fs