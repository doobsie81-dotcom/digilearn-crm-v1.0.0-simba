'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { ArrowRight, MoreHorizontal } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Lead } from '~/db/types'

export const createLeadsColumns = (refreshData: () => void): ColumnDef<Lead & { owner?: { name: '' } }>[] => [
  {
    id: 'title',
    accessorKey: 'title',
    header: 'Title',
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string

      const getStatusVariant = (status: string) => {
        switch (status?.toLowerCase()) {
          case 'new':
            return 'default' as const
          case 'contacted':
            return 'secondary' as const
          case 'qualified':
            return 'default' as const
          case 'converted':
            return 'default' as const
          case 'lost':
            return 'destructive' as const
          default:
            return 'default' as const
        }
      }

      return <Badge variant={getStatusVariant(status)}>{status}</Badge>
    },
  },
  {
    id: 'source',
    accessorKey: 'source',
    header: 'Source',
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => {
      const dateString = row.getValue('createdAt') as string
      const date = new Date(dateString)
      return formatDistanceToNow(date, { addSuffix: true })
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const lead = row.original

      const handleConvertToDeal = async () => {
        try {
          toast.loading('Converting lead to deal...', { id: `convert-${lead.id}` })

          const response = await fetch(`/api/leads/${lead.id}/convert`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: `${lead.name} - Deal`,
              value: 5000, // Default value - could be made configurable
              probability: 50,
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to convert lead to deal')
          }

          const result = await response.json()

          toast.success(`Lead converted to deal successfully!`, {
            id: `convert-${lead.id}`,
            description: `Deal "${result.deal.title}" has been created with ID ${result.deal.id}.`,
          })

          // Refresh the leads data to show updated status
          refreshData()
        } catch (error) {
          console.error('Failed to convert lead:', error)
          toast.error(error instanceof Error ? error.message : 'Failed to convert lead to deal', {
            id: `convert-${lead.id}`,
          })
        }
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {lead.status.toLowerCase() !== 'converted' && lead.status.toLowerCase() !== 'lost' && (
              <DropdownMenuItem onClick={handleConvertToDeal}>
                <ArrowRight className="mr-2 h-4 w-4" />
                Convert to Deal
              </DropdownMenuItem>
            )}
            {lead.status.toLowerCase() === 'converted' && (
              <DropdownMenuItem disabled>
                <ArrowRight className="mr-2 h-4 w-4" />
                Already Converted
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
