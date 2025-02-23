'use client'

import React from 'react'
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Alert,
  Stack
} from "@mui/material"
import { Add } from "@mui/icons-material"
import { ReactNode } from "react"

interface CommonListProps {
  loading?: boolean
  error?: string
  page: number
  rowsPerPage: number
  total: number
  showCreateButton?: boolean
  createButtonText?: string
  onCreateClick?: () => void
  onPageChange: (page: number) => void
  onRowsPerPageChange: (rowsPerPage: number) => void
  filterComponent?: ReactNode
  tableHead: ReactNode
  tableBody: ReactNode
}

export default function CommonList({
  loading,
  error,
  page,
  rowsPerPage,
  total,
  showCreateButton,
  createButtonText = '新建',
  onCreateClick,
  onPageChange,
  onRowsPerPageChange,
  filterComponent,
  tableHead,
  tableBody
}: CommonListProps) {
  return (
    <Box sx={{
      height: 'calc(100% - 48px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }}>
      {/* 顶部操作区 */}
      <Paper sx={{ p: 2, bgcolor: 'white' }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          {filterComponent}

          {showCreateButton && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={onCreateClick}
              sx={{
                background: 'linear-gradient(45deg, #1976d2 30%, #1565c0 90%)',
                px: 3,
                py: 1,
                flexShrink: 0
              }}
            >
              {createButtonText}
            </Button>
          )}
        </Stack>
      </Paper>

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      )}

      {/* 表格区域 */}
      <Paper sx={{
        width: '100%',
        overflow: 'hidden',
        flex: 1
      }}>
        <TableContainer sx={{ maxHeight: 'calc(100% - 52px)', position: 'relative' }}>
          {loading && (
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(255, 255, 255, 0.7)',
              zIndex: 1
            }}>
              <CircularProgress />
            </Box>
          )}
          <Table stickyHeader>
            <TableHead>
              {React.cloneElement(tableHead as any, {
                children: React.Children.map(
                  (tableHead as any).props.children,
                  (cell: any, index: number) => {
                    if (index === React.Children.count((tableHead as any).props.children) - 1) {
                      return React.cloneElement(cell, {
                        sx: {
                          ...cell.props.sx,
                          position: 'sticky',
                          right: 0,
                          bgcolor: 'background.paper',
                          borderLeft: '1px solid',
                          borderLeftColor: 'divider',
                          zIndex: 2,
                          minWidth: 120
                        }
                      })
                    }
                    return cell
                  }
                )
              })}
            </TableHead>
            <TableBody>
              {React.Children.map(tableBody as any, (row: any) => {
                return React.cloneElement(row, {
                  children: React.Children.map(row.props.children, (cell: any, index: number) => {
                    if (index === React.Children.count(row.props.children) - 1) {
                      return React.cloneElement(cell, {
                        sx: {
                          ...cell.props.sx,
                          position: 'sticky',
                          right: 0,
                          bgcolor: 'background.paper',
                          borderLeft: '1px solid',
                          borderLeftColor: 'divider'
                        }
                      })
                    }
                    return cell
                  })
                })
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => onPageChange(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
          labelRowsPerPage="每页行数"
        />
      </Paper>
    </Box>
  )
}
