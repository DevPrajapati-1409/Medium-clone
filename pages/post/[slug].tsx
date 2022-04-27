import { GetStaticProps } from 'next'
import Header from '../../components/Header'
import { urlFor, sanityClient } from '../../sanity'
import { IFormInput, Post, Props } from '../../typings'
import PortableText from 'react-portable-text'
import { useForm, SubmitHandler } from 'react-hook-form'
import { useState } from 'react'

function Post({ post }: Props) {
  const [submitted, setSubmitted] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IFormInput>()

  const onSubmit: SubmitHandler<IFormInput> = (data) => {
    fetch('/api/createComment', {
      method: 'POST',
      body: JSON.stringify(data),
    })
      .then(() => {
        setSubmitted(true)
        reset()
      })
      .catch((err) => {
        console.log('There is an error!')
        setSubmitted(false)
      })
  }

  return (
    <main>
      <Header />

      <img
        className="h-60 w-full object-cover"
        src={urlFor(post.mainImage).url()!}
        alt=""
      />

      <article className="mx-auto max-w-3xl p-5">
        <h1 className="mt-10 mb-3 text-4xl">{post.title}</h1>
        <h2 className="mb-2 text-xl font-normal text-gray-700">
          {post.description}
        </h2>

        <div className="flex items-center space-x-2">
          <img
            className="h-10 w-10 rounded-full"
            src={urlFor(post.author.image).url()!}
            alt=""
          />
          <p className="text-sm font-light">
            Blog post by{' '}
            <span className="text-green-600">{post.author.name}</span>-
            Published on {new Date(post._createdAt).toLocaleString()}
          </p>
        </div>

        <div className="mt-7">
          <PortableText
            className=""
            dataset={process.env.NEXT_PUBLIC_SANITY_DATASET!}
            projectId={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!}
            content={post.body}
            serializers={{
              h1: (props: any) => (
                <h1 className="my-7 text-2xl font-bold" {...props} />
              ),

              h2: (props: any) => (
                <h1 className="my-7 text-xl font-bold" {...props} />
              ),

              li: ({ children }: any) => (
                <li className="ml-4 list-disc"> {children}</li>
              ),

              link: ({ href, children }: any) => (
                <a href={href} className="text-blue-500 hover:underline">
                  {children}
                </a>
              ),
            }}
          />
        </div>
      </article>

      <hr className="my-5 mx-auto max-w-lg border border-yellow-500" />

      {submitted ? (
        <div className="my-10 mx-auto flex max-w-2xl flex-col bg-yellow-500 p-10 text-white">
          <h3 className="text-3xl font-bold">
            Thank you for submitting your comment!
          </h3>

          <p className="text-lg">
            Once it has been approved, it will appear below!
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mx-auto mb-10 flex max-w-2xl flex-col p-5"
        >
          <h3 className="text-xl text-yellow-500">Enjoyed this article?</h3>
          <h4 className="text-3xl font-bold">Leave a Comment Below!</h4>
          <hr className="mt-2 py-3" />

          <input
            {...register('_id')}
            name="_id"
            value={post._id}
            type="hidden"
          />

          <label className="form-label">
            <span className="form-span">Name</span>
            <input
              {...register('name', { required: true })}
              className="form-input-field"
              placeholder="Your Name"
              type="text"
            />
          </label>

          <label className="form-label">
            <span className="form-span">Email</span>
            <input
              {...register('email', { required: true })}
              className="form-input-field"
              placeholder="Your@email.com"
              type="email"
            />
          </label>

          <label className="form-label">
            <span className="form-span">Comment</span>
            <textarea
              {...register('comment', { required: true })}
              className="mt-1 block w-full rounded border py-2 px-3 shadow outline-none ring-yellow-500 focus:ring-2"
              placeholder="Your Comment"
              rows={8}
            />
          </label>

          <div className="flex flex-col p-5">
            {errors.name && (
              <span className="text-red-500">
                {' '}
                - The Name Field is Required
              </span>
            )}

            {errors.email && (
              <span className="text-red-500">
                {' '}
                - The Email Field is Required
              </span>
            )}

            {errors.comment && (
              <span className="text-red-500">
                - The Comment Field is Required
              </span>
            )}
          </div>
          <div className="flex">
            <input
              type="submit"
              className="focus:shadow-outline mx-auto  w-full max-w-sm cursor-pointer rounded-full bg-yellow-500 py-4 px-4 font-bold text-white shadow-lg shadow-yellow-400 hover:bg-yellow-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => reset()}
              className="focus:shadow-outline mx-auto  ml-5 w-full max-w-sm cursor-pointer rounded-full bg-blue-500 py-4 px-4 font-bold text-white shadow-lg shadow-blue-400 hover:bg-blue-400 focus:outline-none"
            >
              Reset
            </button>
          </div>
        </form>
      )}

      <div className="my-10 mx-auto flex max-w-2xl flex-col divide-yellow-300 p-10 shadow-xl shadow-yellow-500">
        <h3 className="text-4xl">Comments</h3>
        <hr className=" pb-2" />

        {post.comments.map((comment) => (
          <div key={comment._id}>
            <p>
              <span className="text-yellow-500">{comment.name}: </span>
              {comment.comment}
            </p>
          </div>
        ))}
      </div>
    </main>
  )
}

export default Post

export const getStaticPaths = async () => {
  const query = `
  *[_type == "post" && slug.current == "post"]{
    _id,
    _createdAt,
    title,
    author-> {
    name,
    image
  },
    'comments': *[
    _type == 'comment' &&
    post._ref == ^._id &&
    approved == true
  ],
    description,
    mainImage,
    slug,
    body
  }`

  const posts = await sanityClient.fetch(query)

  const paths = posts.map((post: Post) => ({
    params: {
      slug: post.slug.current,
    },
  }))

  return {
    paths,
    fallback: 'blocking',
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const query = `*[_type == "post" && slug.current == $slug][0]{
        _id,
        _createdAt,
        title,
        author-> {
        name,
        image
        },
        'comments': *[
        _type == 'comment' &&
        post._ref == ^._id &&
        approved == true],
        description,
        mainImage,
            slug,
        body
      }`

  const post = await sanityClient.fetch(query, {
    slug: params?.slug,
  })

  if (!post) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      post,
    },
    revalidate: 60, // * old cache gets updated every 60 seconds
  }
}