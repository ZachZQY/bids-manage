import { Button, Box, Typography } from "@mui/material"
import { ChevronLeft, ChevronRight } from "@mui/icons-material"

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
}

export default function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize)

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, py: 2 }}>
      <Button
        size="small"
        variant="outlined"
        disabled={page === 1}
        onClick={() => onChange(Math.max(1, page - 1))}
        sx={{ minWidth: 40 }}
      >
        <ChevronLeft />
      </Button>
      <Typography variant="body2" color="text.secondary">
        第 {page} 页 / 共 {totalPages} 页
      </Typography>
      <Button
        size="small"
        variant="outlined"
        disabled={page >= totalPages}
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        sx={{ minWidth: 40 }}
      >
        <ChevronRight />
      </Button>
    </Box>
  )
} 